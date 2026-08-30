import { db, authorsTable, institutionsTable, notificationsTable, resourceAuthorsTable, resourcesTable, userFollowsTable, usersTable } from "@workspace/db";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import { deliverInstantNotificationEmail } from "./notificationEmails";

export async function notifyFollowersForApprovedResources(resourceIds: number[]): Promise<void> {
  if (resourceIds.length === 0) return;
  const resources = await db.select({ id: resourcesTable.id, title: resourcesTable.title })
    .from(resourcesTable).where(inArray(resourcesTable.id, resourceIds));
  const links = await db.select({
    resourceId: resourceAuthorsTable.resourceId,
    authorId: authorsTable.id,
    authorName: authorsTable.name,
    institutionId: institutionsTable.id,
    institutionName: institutionsTable.name,
  }).from(resourceAuthorsTable)
    .innerJoin(authorsTable, eq(resourceAuthorsTable.authorId, authorsTable.id))
    .leftJoin(institutionsTable, eq(authorsTable.institutionId, institutionsTable.id))
    .where(inArray(resourceAuthorsTable.resourceId, resourceIds));
  const follows = await db.select({
    userId: userFollowsTable.userId,
    emailEnabled: usersTable.notificationEmail,
    digest: usersTable.notificationDigest,
    targetType: userFollowsTable.targetType,
    targetKey: userFollowsTable.targetKey,
    targetLabel: userFollowsTable.targetLabel,
  }).from(userFollowsTable)
    .innerJoin(usersTable, eq(userFollowsTable.userId, usersTable.id))
    .where(or(
      eq(usersTable.notificationInApp, true),
      and(eq(usersTable.notificationEmail, true), ne(usersTable.notificationDigest, "off")),
    ));

  for (const resource of resources) {
    const resourceLinks = links.filter((link) => link.resourceId === resource.id);
    const recipients = new Map<number, string[]>();
    for (const follow of follows) {
      const matched = resourceLinks.find((link) => follow.targetType === "author"
        ? String(link.authorId) === follow.targetKey
        : String(link.institutionId ?? "") === follow.targetKey);
      if (matched) recipients.set(follow.userId, [...(recipients.get(follow.userId) ?? []), follow.targetLabel]);
    }
    for (const [userId, labels] of recipients) {
      const source = [...new Set(labels)].join(", ");
      const [notification] = await db.insert(notificationsTable).values({
        userId,
        type: "followed_publication",
        title: `New publication from ${source}`,
        titleZh: `你关注的${source}有新资源`,
        body: resource.title,
        bodyZh: resource.title,
        href: "/academic-resources",
      }).returning({ id: notificationsTable.id });
      const recipient = follows.find((follow) => follow.userId === userId);
      if (recipient?.emailEnabled && recipient.digest === "instant") {
        void deliverInstantNotificationEmail(notification.id);
      }
    }
  }
}
