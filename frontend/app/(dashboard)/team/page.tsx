"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, apiRequest } from "@/lib/api";
import type { UsersResponse } from "@/types/reports";

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function TeamMembersPage() {
  const [members, setMembers] = useState<UsersResponse | null>(null);

  const [searchInput, setSearchInput] = useState("");

  const [appliedSearch, setAppliedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);

    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "12",
        role: "TEAM_MEMBER",
        isActive: "true",
      });

      if (appliedSearch) {
        query.set("search", appliedSearch);
      }

      const response = await apiRequest<UsersResponse>(
        `/users?${query.toString()}`,
      );

      setMembers(response);
    } catch (error) {
      setMembers(null);

      toast.error("Unable to load team members", {
        description:
          error instanceof ApiError
            ? error.message
            : "Please confirm that the backend server is running.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [appliedSearch, page]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  function applySearch(event: FormEvent) {
    event.preventDefault();

    setPage(1);
    setAppliedSearch(searchInput.trim());
  }

  function resetSearch() {
    setSearchInput("");
    setAppliedSearch("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Users className="size-6" />
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Team members
            </h1>

            <p className="mt-1 text-muted-foreground">
              View employee profiles and reporting activity.
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Find a team member</CardTitle>

          <CardDescription>
            Search using a member&apos;s name, email address or job title.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={applySearch}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search team members..."
                className="pl-9"
              />
            </div>

            <Button type="submit">
              <Search className="size-4" />
              Search
            </Button>

            {appliedSearch && (
              <Button type="button" variant="outline" onClick={resetSearch}>
                <RotateCcw className="size-4" />
                Reset
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active members</CardTitle>

          <CardDescription>
            {isLoading
              ? "Loading team members..."
              : `${members?.pagination.total ?? 0} member${
                  members?.pagination.total === 1 ? "" : "s"
                } found`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
                <span>Loading members...</span>
              </div>
            </div>
          ) : members && members.data.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {members.data.map((member) => (
                  <article
                    key={member.id}
                    className="flex flex-col rounded-xl border p-5 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {getInitials(member.firstName, member.lastName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-semibold">
                          {member.firstName} {member.lastName}
                        </h2>

                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {member.jobTitle ?? "Team Member"}
                        </p>

                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 border-t pt-4">
                      <Link
                        href={`/team/${member.id}`}
                        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-muted"
                      >
                        <UserRound className="size-4" />
                        View profile
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              {members.pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {members.pagination.page} of{" "}
                    {members.pagination.totalPages}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page >= members.pagination.totalPages}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4">
                <Users className="size-7 text-muted-foreground" />
              </div>

              <h2 className="mt-4 font-semibold">No team members found</h2>

              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {appliedSearch
                  ? "No members match your search."
                  : "There are currently no active team members."}
              </p>

              {appliedSearch && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={resetSearch}
                >
                  <RotateCcw className="size-4" />
                  Clear search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
