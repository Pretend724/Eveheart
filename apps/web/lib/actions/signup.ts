"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/schemas/auth";

const SignupActionSchema = RegisterSchema.extend({
  confirmPassword: RegisterSchema.shape.password,
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export type SignupActionState = {
  error: string;
};

export async function signupAction(
  _prevState: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName.trim() : "";

  const validation = SignupActionSchema.safeParse({
    name: name || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validation.success) {
    const message = validation.error.issues[0]?.message ?? "表单数据无效";
    return { error: message };
  }

  const { email, password, name: validName } = validation.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { error: "该邮箱已被注册" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: validName,
    },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard/chat",
    });

    return { error: "" };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "注册成功，但自动登录失败，请手动登录" };
    }

    throw error;
  }
}
