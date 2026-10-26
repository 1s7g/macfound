import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { POST_RETENTION_DAYS } from "@/lib/vocabulary";

export const metadata: Metadata = { title: "Privacy · MacFound" };

/**
 * What MacFound collects and what happens to it, in plain language.
 *
 * Public, with no sign-in, so it can be read before handing over an email
 * address. Every statement here describes behaviour the code actually has —
 * retention comes from the same constant the expiry job uses — so if the
 * behaviour changes, this page is the second thing to update.
 */
export default function PrivacyPage() {
  const contact = process.env.CONTACT_EMAIL;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link href="/" className="text-sm text-subtle transition-colors hover:text-ink">
        ← MacFound
      </Link>

      <h1 className="mt-4 text-title font-semibold text-ink">Privacy</h1>
      <p className="mt-2 text-muted">
        MacFound is a student project for reuniting lost items at McMaster. It is
        not run by McMaster University. Here is what it keeps and why.
      </p>

      <Section title="What we collect">
        <li>
          <strong>Your McMaster email address</strong>, to sign you in and to send
          you sign-in codes and notifications. Your display name is the part before
          the @.
        </li>
        <li>
          <strong>What you post</strong>: titles, descriptions, the building and
          date, and any photos you add.
        </li>
        <li>
          <strong>Claims and messages</strong> you send about an item.
        </li>
        <li>
          Basic technical logs kept by our hosting provider, such as when a page
          was requested.
        </li>
      </Section>

      <Section title="Who can see it">
        <li>
          Posts and their photos are visible to anyone signed in with a McMaster
          email. Photo links are public to anyone who has them, so never photograph
          student cards, IDs or documents.
        </li>
        <li>
          A claim&rsquo;s description is seen only by the person holding the item.
        </li>
        <li>Messages are seen only by the two people in the conversation.</li>
        <li>
          If something is reported, a moderator can see the reported post to decide
          whether to take it down.
        </li>
        <li>Your email address is never shown to other users.</li>
      </Section>

      <Section title="How long it's kept">
        <li>
          Posts close automatically after {POST_RETENTION_DAYS} days. A closed
          post&rsquo;s photos are deleted; its text stays readable to anyone with
          the link.
        </li>
        <li>Deleting a post deletes its photos straight away.</li>
        <li>
          Messages, claims and your account stay until you delete your account.
        </li>
      </Section>

      <Section title="Emails">
        <li>
          We email sign-in codes, and notifications about matches, claims and
          messages. You can turn off match and message emails on your profile page.
        </li>
        <li>We don&rsquo;t send marketing, and we don&rsquo;t sell or share your data.</li>
      </Section>

      <Section title="Services we use">
        <li>Vercel hosts the site and stores photos.</li>
        <li>Neon hosts the database.</li>
        <li>Resend delivers email.</li>
      </Section>

      <Section title="Deleting your account">
        <li>
          On your profile page, choose <strong>Delete my account</strong>. Your
          account, posts, photos, claims, messages and notifications are deleted
          permanently.
        </li>
      </Section>

      {contact && (
        <p className="mt-10 text-sm text-muted">
          Questions? Email{" "}
          <a href={`mailto:${contact}`} className="font-medium text-brand-text underline underline-offset-2">
            {contact}
          </a>
          .
        </p>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-semibold text-ink">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-ink marker:text-subtle">
        {children}
      </ul>
    </section>
  );
}
