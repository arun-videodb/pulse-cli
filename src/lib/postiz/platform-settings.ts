import type { PostizPostSettings } from "./client.js";

export interface PlatformSettingField {
  key: string;
  label: string;
  type: "text" | "select";
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string;
}

export const PLATFORM_REQUIRED_FIELDS: Record<string, PlatformSettingField[]> = {
  reddit: [
    {
      key: "subreddit_name",
      label: "Subreddit",
      type: "text",
      required: true,
      placeholder: "e.g. videodb (without r/)",
    },
    {
      key: "subreddit_title",
      label: "Post Title",
      type: "text",
      required: true,
      placeholder: "Title for the Reddit post",
    },
    {
      key: "subreddit_type",
      label: "Post Type",
      type: "select",
      required: true,
      defaultValue: "self",
      options: [
        { value: "self", label: "Text Post" },
        { value: "link", label: "Link Post" },
        { value: "image", label: "Image Post" },
      ],
    },
  ],
  x: [
    {
      key: "who_can_reply_post",
      label: "Who Can Reply",
      type: "select",
      required: true,
      defaultValue: "everyone",
      options: [
        { value: "everyone", label: "Everyone" },
        { value: "following", label: "People you follow" },
        { value: "mentionedUsers", label: "Mentioned users only" },
        { value: "subscribers", label: "Subscribers only" },
        { value: "verified", label: "Verified accounts only" },
      ],
    },
  ],
};

export function buildPlatformSettings(
  platform: string,
  userSettings: Record<string, string>,
  campaignTitle?: string,
  hasMedia?: boolean
): PostizPostSettings {
  switch (platform) {
    case "x":
      return {
        __type: "x",
        who_can_reply_post: userSettings.who_can_reply_post || "everyone",
        community: "",
        active_thread_finisher: false,
        thread_finisher: "",
      };

    case "reddit": {
      const postType = hasMedia
        ? "media"
        : userSettings.subreddit_type || "self";
      const subredditName = userSettings.subreddit_name || "";
      const formattedSubreddit = subredditName.startsWith("/r/")
        ? subredditName.endsWith("/")
          ? subredditName
          : `${subredditName}/`
        : `/r/${subredditName}/`;

      const hasFlair = !!userSettings.flair_id;

      return {
        __type: "reddit",
        subreddit: [
          {
            value: {
              subreddit: formattedSubreddit,
              allow: ["self", "link", "media"],
              is_flair_required: hasFlair,
              ...(hasFlair
                ? {
                    flair: {
                      id: userSettings.flair_id,
                      name: userSettings.flair_name || "",
                    },
                  }
                : {}),
              type: postType,
              media: [],
              title: userSettings.subreddit_title || campaignTitle || "",
            },
          },
        ],
      };
    }

    case "linkedin":
    case "linkedin-page":
      return {
        __type: platform,
        post_as_images_carousel: false,
      };

    default:
      return { __type: platform };
  }
}

export function getDefaultFieldValues(
  platform: string,
  campaignTitle?: string
): Record<string, string> {
  const fields = PLATFORM_REQUIRED_FIELDS[platform];
  if (!fields) return {};

  const defaults: Record<string, string> = {};
  for (const field of fields) {
    if (field.defaultValue) {
      defaults[field.key] = field.defaultValue;
    }
  }

  if (platform === "reddit" && campaignTitle) {
    defaults.subreddit_title = campaignTitle;
  }

  return defaults;
}
