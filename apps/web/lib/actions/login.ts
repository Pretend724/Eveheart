"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { LoginSchema } from "@/schemas/auth";

export type LoginActionState = {
  error: string;
};

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const validation = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validation.success) {
    const message = validation.error.issues[0]?.message ?? "表单数据无效";
    return { error: message };
  }

  const { email, password } = validation.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });

    return { error: "" };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "邮箱或密码错误" };
      }

      return { error: "登录失败，请稍后重试" };
    }

    throw error;
  }
}
