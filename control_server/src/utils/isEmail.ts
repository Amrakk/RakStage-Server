import z from "zod";

export async function isEmail(email: string): Promise<boolean> {
    const emailSchema = z.string().email();
    const result = await emailSchema.safeParseAsync(email);
    return !result.error;
}
