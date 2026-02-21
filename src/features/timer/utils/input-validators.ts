import { z } from "zod";

/**
 * GitHub owner: 英数字・ハイフン、1-39文字、先頭・末尾はハイフン不可
 * ref: https://docs.github.com/en/get-started/using-github/github-glossary#username
 *
 * 注: 複雑な正規表現（ReDoS 懸念）を避けるため、文字種チェックと
 *     先頭・末尾チェックを別々の refine で実装している。
 */
export const githubOwnerSchema = z
  .string()
  .min(1, "owner は必須です")
  .max(39, "owner は39文字以内で入力してください")
  .refine(
    (s) => /^[a-zA-Z0-9-]+$/.test(s),
    "owner は英数字とハイフンのみ使用できます",
  )
  .refine(
    (s) => !s.startsWith("-") && !s.endsWith("-"),
    "owner の先頭・末尾にハイフンは使用できません",
  );

/**
 * GitHub repo: 英数字・ハイフン・アンダースコア・ドット、1-100文字
 * ref: https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories
 */
export const githubRepoSchema = z
  .string()
  .min(1, "repo は必須です")
  .max(100, "repo は100文字以内で入力してください")
  .regex(
    /^[a-zA-Z0-9_.-]+$/,
    "repo は英数字・ハイフン・アンダースコア・ドットのみ使用できます",
  );

/**
 * GitHub Issue 番号: 1-999999 の正の整数
 * GitHub 上の Issue 番号の実用的な上限として 999999 を設定する
 */
export const githubIssueNumberSchema = z
  .number()
  .int("Issue 番号は整数で入力してください")
  .min(1, "Issue 番号は1以上で入力してください")
  .max(999999, "Issue 番号が大きすぎます（上限: 999999）");

/**
 * "owner/repo" 形式の文字列を検証・分解する。
 * エラー時は { error: string }、成功時は { owner, repo } を返す。
 */
export function parseAndValidateOwnerRepo(
  input: string,
): { owner: string; repo: string } | { error: string } {
  const trimmed = input.trim();
  const slashIndex = trimmed.indexOf("/");
  if (slashIndex === -1 || trimmed.indexOf("/", slashIndex + 1) !== -1) {
    return { error: 'Owner/Repo は "owner/repo" 形式で入力してください' };
  }

  const rawOwner = trimmed.slice(0, slashIndex);
  const rawRepo = trimmed.slice(slashIndex + 1);

  const ownerResult = githubOwnerSchema.safeParse(rawOwner);
  if (!ownerResult.success) {
    return { error: ownerResult.error.issues[0]?.message ?? "owner が無効です" };
  }

  const repoResult = githubRepoSchema.safeParse(rawRepo);
  if (!repoResult.success) {
    return { error: repoResult.error.issues[0]?.message ?? "repo が無効です" };
  }

  return { owner: ownerResult.data, repo: repoResult.data };
}

/**
 * Issue 番号の文字列入力を検証する。
 * エラー時は { error: string }、成功時は { value: number } を返す。
 */
export function validateIssueNumber(
  input: string,
): { value: number } | { error: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { error: "Issue 番号は必須です" };
  }
  const num = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(num) || String(num) !== trimmed) {
    return { error: "Issue 番号は正の整数を入力してください" };
  }
  const result = githubIssueNumberSchema.safeParse(num);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Issue 番号が無効です" };
  }
  return { value: result.data };
}

/**
 * 会議名・アジェンダタイトル: 1-200 文字、制御文字禁止
 */
export const meetingTitleSchema = z
  .string()
  .min(1, "タイトルは必須です")
  .max(200, "タイトルは200文字以内で入力してください")
  // 制御文字（0x00-0x1F, 0x7F）を禁止（XSS の踏み台となる不正文字を排除）
  .regex(/^[^\x00-\x1f\x7f]*$/, "タイトルに使用できない文字が含まれています");
