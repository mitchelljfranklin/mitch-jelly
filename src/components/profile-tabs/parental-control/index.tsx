"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  UserDto,
  ParentalRating,
  UserPolicy,
} from "@jellyfin/sdk/lib/generated-client/models";
import { useEffect, useState } from "react";
import { fetchParentalRatings, updateUserPolicy } from "../../../actions";
import { Button } from "../../ui/button";
import { Form } from "../../ui/form";
import { toast } from "sonner";
import { parentalControlFormSchema, ParentalControlFormValues } from "./schema";
import { RatingSection } from "./rating-section";
import { UnratedItemsSection } from "./unrated-items-section";
import { TagsSection } from "./tags-section";
import { useSetAtom } from "jotai";
import { dashboardLoadingAtom } from "../../../lib/atoms";
import { useAuthError } from "@/src/hooks/use-auth-error";

export default function ParentalControlTab({ user }: { user?: UserDto }) {
  const [ratings, setRatings] = useState<ParentalRating[]>([]);
  const setDashboardLoading = useSetAtom(dashboardLoadingAtom);
  const { handleAuthError } = useAuthError();

  useEffect(() => {
    setDashboardLoading(true);
    fetchParentalRatings()
      .then(setRatings)
      .catch((err) => {
        console.error("Failed to fetch parental ratings:", err);
        if (handleAuthError(err)) return;
      })
      .finally(() => setDashboardLoading(false));
  }, [setDashboardLoading]);

  const form = useForm<ParentalControlFormValues>({
    resolver: zodResolver(parentalControlFormSchema) as any,
    defaultValues: {
      MaxParentalRating: user?.Policy?.MaxParentalRating ?? null,
      BlockUnratedItems: (user?.Policy?.BlockUnratedItems as string[]) || [],
      AllowedTags: user?.Policy?.AllowedTags || [],
      BlockedTags: user?.Policy?.BlockedTags || [],
    },
  });

  useEffect(() => {
    if (user?.Id) {
      if (
        form.getFieldState("MaxParentalRating").isDirty === false &&
        form.getFieldState("BlockUnratedItems").isDirty === false
      ) {
        form.reset({
          MaxParentalRating: user.Policy?.MaxParentalRating ?? null,
          BlockUnratedItems: (user.Policy?.BlockUnratedItems as string[]) || [],
          AllowedTags: user.Policy?.AllowedTags || [],
          BlockedTags: user.Policy?.BlockedTags || [],
        });
      }
    }
  }, [user, form]);

  async function onSubmit(data: ParentalControlFormValues) {
    if (!user?.Id || !user.Policy) return;

    setDashboardLoading(true);
    try {
      const updatedPolicy: UserPolicy = {
        ...user.Policy,
        MaxParentalRating: data.MaxParentalRating,
        BlockUnratedItems: data.BlockUnratedItems as any[],
        AllowedTags: data.AllowedTags || [],
        BlockedTags: data.BlockedTags || [],
      };

      await updateUserPolicy(user.Id, updatedPolicy);
      toast.success("Parental controls updated successfully");
    } catch (error) {
      console.error("Failed to update parental controls:", error);
      if (handleAuthError(error)) return;
      toast.error("Failed to update parental controls");
    } finally {
      setDashboardLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 w-full pb-10"
      >
        <RatingSection ratings={ratings} />
        <UnratedItemsSection />
        <TagsSection />

        <div className="flex justify-end pt-6">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
}
