import React, { useState } from 'react';
import { Github, Link2, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useIntegrationLinkStore } from '@/features/timer/stores/integration-link-store';
import { fetchGitHubIssue } from '@/features/timer/api/github-issues';

interface GitHubIssueLinkingProps {
  timeLogId: string;
}

export const GitHubIssueLinking: React.FC<GitHubIssueLinkingProps> = ({ timeLogId }) => {
  const { getLinks, addLink, removeLink, githubPat, setGithubPat } = useIntegrationLinkStore();
  const links = getLinks(timeLogId);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [ownerRepo, setOwnerRepo] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [error, setError] = useState('');
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);

  const handleAdd = async () => {
    setError('');

    const parts = ownerRepo.trim().split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError('Owner/Repo は "owner/repo" 形式で入力してください');
      return;
    }
    const num = parseInt(issueNumber, 10);
    if (!issueNumber.trim() || isNaN(num) || num <= 0) {
      setError('Issue 番号は正の整数を入力してください');
      return;
    }

    const [owner, repo] = parts;
    let resolvedTitle = issueTitle.trim() || undefined;
    let resolvedIssueUrl = `https://github.com/${owner}/${repo}/issues/${num}`;

    if (!resolvedTitle) {
      setIsFetchingTitle(true);
      try {
        const issue = await fetchGitHubIssue({
          owner,
          repo,
          issueNumber: num,
          pat: githubPat ?? undefined,
        });
        resolvedTitle = issue.title;
        resolvedIssueUrl = issue.issueUrl;
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Issue タイトルの取得に失敗しました',
        );
        return;
      } finally {
        setIsFetchingTitle(false);
      }
    }

    addLink(timeLogId, {
      owner,
      repo,
      issueNumber: num,
      issueTitle: resolvedTitle,
      issueUrl: resolvedIssueUrl,
    });

    setOwnerRepo('');
    setIssueNumber('');
    setIssueTitle('');
    setIsFormOpen(false);
    setIsExpanded(true);
  };

  const handleCancel = () => {
    setOwnerRepo('');
    setIssueNumber('');
    setIssueTitle('');
    setError('');
    setIsFormOpen(false);
  };

  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      {/* ヘッダー行 */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-full text-left"
        aria-expanded={isExpanded}
      >
        <Github className="w-3.5 h-3.5" />
        <span>GitHub Issue 連携</span>
        {links.length > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
            {links.length}
          </Badge>
        )}
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 ml-auto" />
        ) : (
          <ChevronDown className="w-3 h-3 ml-auto" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2">
          <div className="space-y-1 rounded-md bg-muted/60 p-2">
            <Label htmlFor={`github-pat-${timeLogId}`} className="text-xs">
              GitHub PAT（Private リポジトリ用 / メモリのみ保持）
            </Label>
            <Input
              id={`github-pat-${timeLogId}`}
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={githubPat ?? ''}
              onChange={(e) => setGithubPat(e.target.value || null)}
              className="h-7 text-xs"
            />
          </div>

          {/* 連携済みリスト */}
          {links.length > 0 && (
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.id} className="flex min-w-0 items-start gap-2 text-xs">
                  <Link2 className="w-3 h-3 text-muted-foreground shrink-0" />
                  <a
                    href={link.issueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 break-all text-blue-600 hover:underline"
                  >
                    {link.owner}/{link.repo} #{link.issueNumber}
                    {link.issueTitle && (
                      <span className="text-muted-foreground ml-1">— {link.issueTitle}</span>
                    )}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(timeLogId, link.id)}
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    aria-label={`${link.owner}/${link.repo} #${link.issueNumber} の連携を解除`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {/* 追加フォーム */}
          {isFormOpen ? (
            <div className="space-y-2 p-2 bg-muted rounded-md">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor={`owner-repo-${timeLogId}`} className="text-xs">
                    Owner/Repo
                  </Label>
                  <Input
                    id={`owner-repo-${timeLogId}`}
                    placeholder="owner/repo"
                    value={ownerRepo}
                    onChange={(e) => setOwnerRepo(e.target.value)}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`issue-num-${timeLogId}`} className="text-xs">
                    Issue #
                  </Label>
                  <Input
                    id={`issue-num-${timeLogId}`}
                    placeholder="36"
                    value={issueNumber}
                    onChange={(e) => setIssueNumber(e.target.value)}
                    type="number"
                    min="1"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`issue-title-${timeLogId}`} className="text-xs">
                  Issue タイトル（任意）
                </Label>
                <Input
                  id={`issue-title-${timeLogId}`}
                  placeholder="Issue タイトルを入力（任意）"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} className="h-6 text-xs px-2">
                  {isFetchingTitle ? '取得中...' : '紐付け'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancel}
                  className="h-6 text-xs px-2"
                  disabled={isFetchingTitle}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFormOpen(true)}
              className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
              disabled={isFetchingTitle}
            >
              <Plus className="w-3 h-3 mr-1" />
              GitHub Issue を紐付ける
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
