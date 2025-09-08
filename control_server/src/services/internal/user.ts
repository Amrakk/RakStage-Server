import ImgbbService from "../external/imgbb.js";
import { isEmail } from "../../utils/isEmail.js";
import { ObjectId, ZodObjectId } from "mongooat";
import { UserModel } from "../../database/models/user.js";
import { SOCIAL_MEDIA_PROVIDER } from "../../constants.js";
import { verifyPassword } from "../../utils/hashPassword.js";
import { toLowerNonAccentVietnamese } from "../../utils/removeDiacritics.js";

import NotFoundError from "../../errors/NotFoundError.js";
import UnauthorizedError from "../../errors/UnauthorizeError.js";

import type { IResUser } from "../../interfaces/api/response.js";
import type { IUser, IUserProfile } from "../../interfaces/database/user.js";
import type { IOffsetPagination, IReqAuth, IReqUser } from "../../interfaces/api/request.js";

export default class UserService {
    // Query
    public static async getAll(query: IReqUser.Filter & IOffsetPagination): Promise<[IUser[], number]> {
        const { page, limit, role, searchTerm, status } = query;
        const skip = ((page ?? 1) - 1) * (limit ?? 0);

        const normalizedSearchTerm = toLowerNonAccentVietnamese(searchTerm ?? "");
        const filter = {
            deletedAt: { $eq: null },
            ...(role?.length ? { role: { $in: role } } : {}),
            ...(status?.length ? { status: { $in: status } } : {}),
            ...(searchTerm
                ? {
                      $or: [
                          { name: { $regex: normalizedSearchTerm, $options: "i" } },
                          { _name: { $regex: normalizedSearchTerm, $options: "i" } },
                          { email: { $regex: normalizedSearchTerm, $options: "i" } },
                          { phoneNumber: { $regex: normalizedSearchTerm, $options: "i" } },
                      ],
                  }
                : {}),
        };

        const [users, totalDocuments] = await Promise.all([
            UserModel.collection
                .find(filter, { projection: { _name: 0 } })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit ?? 0)
                .toArray(),
            UserModel.countDocuments(filter),
        ]);

        return [users, totalDocuments];
    }

    public static async getById(id: ObjectId | string): Promise<IUser | null>;
    public static async getById(id: ObjectId | string, isGetProfile: true): Promise<IUserProfile | null>;
    public static async getById(id: ObjectId | string, isGetProfile?: true): Promise<IUserProfile | IUser | null> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("User not found");

        const user = await UserModel.findOne(
            { _id: result.data, deletedAt: { $eq: null } },
            { projection: { _name: 0 } }
        );
        if (user && isGetProfile) {
            const { _id, email, name, phoneNumber, avatarUrl } = user;
            return { _id, email, name, phoneNumber, avatarUrl };
        }

        return user;
    }

    public static async getByEmailOrPhone(
        requestId: ObjectId,
        emailOrPhone: string
    ): Promise<IResUser.GetByEmailOrPhone | null> {
        const user = await isEmail(emailOrPhone).then((val) =>
            val ? this.getByEmail(emailOrPhone) : this.getByPhone(emailOrPhone)
        );
        return user && `${user._id}` !== `${requestId}`
            ? {
                  _id: user._id,
                  name: user.name,
                  email: user.email,
                  avatarUrl: user.avatarUrl,
                  phoneNumber: user.phoneNumber,
              }
            : null;
    }

    public static async getByEmail(email: string): Promise<IUser | null> {
        return UserModel.findOne({ email, deletedAt: { $eq: null } }, { projection: { _name: 0 } });
    }

    public static async getByPhone(phoneNumber: string): Promise<IUser | null> {
        return UserModel.findOne({ phoneNumber, deletedAt: { $eq: null } }, { projection: { _name: 0 } });
    }

    // Mutation
    public static async insert(users: IReqUser.Insert[]): Promise<IUser[]> {
        const insertUser = users.map((user, i) => ({
            ...user,
            _name: user.name,
            createdAt: new Date(new Date().getTime() + i),
        }));
        const insertedUsers = await UserModel.insertMany(insertUser);
        return insertedUsers.map(({ _name, ...user }) => user);
    }

    public static async updateById(id: ObjectId | string, data: IReqUser.Update): Promise<IUser> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("User not found");

        const updateData = {
            ...data,
            ...(data.name ? { _name: data.name } : {}),
            updatedAt: new Date(),
        };

        const user = await UserModel.findOneAndUpdate({ _id: result.data, deletedAt: { $eq: null } }, updateData, {
            returnDocument: "after",
            projection: { _name: 0 },
        });
        if (!user) throw new NotFoundError("User not found");

        return user;
    }

    public static async updateByEmail(email: string, data: IReqUser.Update): Promise<IUser> {
        const updateData = {
            ...data,
            ...(data.name ? { _name: data.name } : {}),
            updatedAt: new Date(),
        };

        const user = await UserModel.findOneAndUpdate({ email, deletedAt: { $eq: null } }, updateData, {
            returnDocument: "after",
            projection: { _name: 0 },
        });
        if (!user) throw new NotFoundError("User not found");

        return user;
    }

    public static async updateAvatar(id: ObjectId | string, image: Buffer): Promise<string> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("User not found");

        const { url, deleteUrl } = await ImgbbService.uploadImage(image);

        const updateResult = await UserModel.updateOne(
            { _id: result.data, deletedAt: { $eq: null } },
            { avatarUrl: url, updatedAt: new Date() }
        ).catch(async (err) => {
            await fetch(deleteUrl, { method: "GET" });
            throw err;
        });

        if (updateResult.matchedCount === 0) throw new NotFoundError("User not found");
        return url;
    }

    public static async updateSocialMediaAccounts(
        id: ObjectId | string,
        data: {
            accountId: string;
            provider: SOCIAL_MEDIA_PROVIDER;
        }
    ): Promise<IUser> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("User not found");

        const user = await UserModel.collection.findOneAndUpdate(
            { _id: result.data, deletedAt: { $eq: null } },
            {
                $push: { socialMediaAccounts: { provider: data.provider, accountId: data.accountId } },
            },
            { returnDocument: "after", projection: { _name: 0 } }
        );
        if (!user) throw new NotFoundError("User not found");

        return user;
    }

    public static async deleteById(id: ObjectId | string): Promise<IUser> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("User not found");

        const user = await UserModel.findOneAndUpdate(
            { _id: result.data, deletedAt: { $eq: null } },
            { deletedAt: new Date() },
            { returnDocument: "after", projection: { _name: 0 } }
        );
        if (!user) throw new NotFoundError("User not found");

        return user;
    }

    // Auth
    public static async login(emailOrPhone: string, pass: string): Promise<Omit<IUser, "password">> {
        let user = await ((await isEmail(emailOrPhone))
            ? this.getByEmail(emailOrPhone)
            : this.getByPhone(emailOrPhone));
        if (!user) throw new UnauthorizedError();

        const result = await verifyPassword(pass, user.password);
        if (!result) throw new UnauthorizedError();

        const { password, ...rest } = user;
        return rest;
    }

    public static async register(data: IReqAuth.Register): Promise<Omit<IUser, "password">> {
        const { name, ...restData } = data;

        const user = await UserModel.insertOne({
            ...restData,
            name,
            _name: name,
        });

        const { password, _name, ...rest } = user;
        return rest;
    }
}
