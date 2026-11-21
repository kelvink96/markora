import { Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLinkButton } from "../external-link";
import { GithubMark } from "../github-mark";
import {
  GITHUB_FEEDBACK_URL,
  GITHUB_RELEASES_URL,
  GITHUB_REPO_URL,
} from "../../features/community/github-urls";

/** Where to find the project: star it, read the releases, or tell us what you think. */
export function GithubCard() {
  return (
    <Card id="settings-github" role="region" aria-label="Markora on GitHub" className="mt-10 gap-4 py-4 text-sm">
      <CardHeader className="px-4">
        <CardTitle role="heading" aria-level={3} className="flex items-center gap-2">
          <GithubMark className="size-4" />
          Markora on GitHub
        </CardTitle>
        <CardDescription>Free and open source. A star helps other writers find it.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 px-4">
        <ExternalLinkButton href={GITHUB_REPO_URL} variant="default">
          <Star aria-hidden="true" />
          Star on GitHub
        </ExternalLinkButton>
        <ExternalLinkButton href={GITHUB_RELEASES_URL}>Releases</ExternalLinkButton>
        <ExternalLinkButton href={GITHUB_FEEDBACK_URL}>Send feedback</ExternalLinkButton>
      </CardContent>
    </Card>
  );
}
