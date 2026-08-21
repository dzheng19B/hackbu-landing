import type { AnchorHTMLAttributes, ReactNode } from 'react'

type ExternalLinkProps = {
  href: string
  children: ReactNode
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'>

/**
 * Every off-site link on the page goes through here so the new-tab + rel
 * hardening can never be forgotten. mailto: links use MailLink instead — a
 * mail client should not open in a throwaway browser tab.
 */
export function ExternalLink({ href, children, ...rest }: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  )
}

export function MailLink({
  email,
  children,
  ...rest
}: { email: string; children?: ReactNode } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href' | 'children'
>) {
  return (
    <a href={`mailto:${email}`} rel="noopener noreferrer" {...rest}>
      {children ?? email}
    </a>
  )
}
