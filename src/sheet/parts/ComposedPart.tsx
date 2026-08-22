import type { ReactNode } from 'react'
import { Block, Caption, Entry, Rule, SheetSection, Stage } from '../kit'
import { SiteHeader } from '../../components/SiteHeader'
import { SiteFooter } from '../../components/SiteFooter'
import { IntroSection } from '../../components/sections/IntroSection'
import { AboutSection } from '../../components/sections/AboutSection'
import { GetInvolvedSection } from '../../components/sections/GetInvolvedSection'
import { QuestionsSection } from '../../components/sections/QuestionsSection'
import { ContactSection } from '../../components/sections/ContactSection'

/**
 * Part 3 — the composed pieces, rendered exactly as the page renders them.
 *
 * Each of these takes no props: the copy, the links and the layout are the
 * component. What varies between them is which ground they sit on and which
 * link treatment that forces, which is what the notes below record.
 */

/** None of the composed components take props; say so once, in the same shape. */
function NoProps({ children }: { children: ReactNode }) {
  return (
    <Block title="Props">
      <p className="text-body text-pine">
        None. <span className="text-pine/90">{children}</span>
      </p>
    </Block>
  )
}

export function ComposedPart() {
  return (
    <SheetSection
      id="composed"
      number="3"
      title="Composed, as used"
      intro="The header, the five content sections and the footer — imported from src/components/ and rendered here unmodified. Page order is: header, hero, drift-c, Intro, About, drift-a, Get involved, drift-b, Questions, drift-c, Contact, cloud-to-frost, footer."
    >
      <Entry
        name="SiteHeader"
        path="src/components/SiteHeader.tsx"
        use="The fixed page bar: the lockup, three destinations and the Discord CTA, collapsing behind a toggle below 768px."
      >
        <NoProps>
          It reads NAV_LINKS and DISCORD_URL from src/lib/links.ts and owns one
          piece of state — whether the compact menu is open.
        </NoProps>

        <Block title="As rendered">
          <Stage
            label="SiteHeader — live"
            note="Below 768px the links collapse; the toggle here is real, so open and close it. Escape closes the panel and returns focus to the button."
            className="sheet-fixed-frame bg-cloud relative h-[26rem] overflow-hidden"
          >
            <SiteHeader />
            <div className="px-6 pt-24 sm:px-8 sm:pt-28">
              <p className="text-caption text-pine/90 max-w-md">
                The header is <b>position: fixed</b>. This frame carries a
                transform, which makes it the containing block for fixed
                descendants — so the bar pins to the top of the frame instead of
                to the sheet’s viewport. On the real page it pins to the
                viewport and content scrolls under it, as this filler copy is
                doing.
              </p>
            </div>
          </Stage>
        </Block>

        <Block title="Notes">
          <Rule>
            The bar is <b>h-16</b> below 640px and <b>h-20</b> from there up, and
            everything that has to clear it — the scroll anchors’{' '}
            <b>scroll-mt-24</b>, the <b>scroll-padding-top</b> in{' '}
            <b>src/index.css</b> — is written against those two numbers. Both the
            bar and the compact panel are opaque cloud, so every link inside
            takes <b>LINK_ON_CLOUD</b> and hovers to brick.
          </Rule>
          <Caption>
            The compact panel stays mounted and is hidden with the{' '}
            <b>hidden</b> attribute, so <b>aria-controls</b> always resolves to a
            real element. The toggle is a real <b>&lt;button&gt;</b> with{' '}
            <b>aria-expanded</b>, and the lockup’s <b>aria-label</b> is what
            gives the home link its accessible name — the marks are empty
            elements with no text to fall back on.
          </Caption>
        </Block>
      </Entry>

      <Entry
        name="IntroSection"
        path="src/components/sections/IntroSection.tsx"
        use="The page’s masthead. It sits directly under the hero and carries the only <h1>."
      >
        <NoProps>Copy is written into the component.</NoProps>
        <Block title="As rendered">
          <Stage
            label="IntroSection — on cloud"
            note="On this sheet it means a second <h1> on the page. That is a property of the sheet, not of the section."
          >
            <IntroSection />
          </Stage>
        </Block>
        <Block title="Notes">
          <Rule>
            The hero above it is illustration only: cloud text over the painted
            sky measured <b>1.43:1</b>, and the only wash that lifted it past
            4.5:1 was a near-opaque pine field over most of the frame. Moving the
            headline, lede and CTA down here retired that trade rather than
            tuning it — no text sits over the artwork at any scroll position.
          </Rule>
        </Block>
      </Entry>

      <Entry
        name="AboutSection"
        path="src/components/sections/AboutSection.tsx"
        use="What the club is, plus the two pillars — the weekly workshops and the annual hackathon."
      >
        <NoProps>The two pillars are a const array inside the file.</NoProps>
        <Block title="As rendered">
          <Stage
            label="AboutSection — on cloud"
            note="A Reveal around the header, then a RevealGroup as='ul' of two RevealItem as='li' cards, staggered 0.12s apart."
          >
            <AboutSection />
          </Stage>
        </Block>
        <Block title="Notes">
          <Caption>
            Intro and About are one uninterrupted stretch of cloud — there is no
            divider between them, because a drift there would separate nothing.
          </Caption>
        </Block>
      </Entry>

      <Entry
        name="GetInvolvedSection"
        path="src/components/sections/GetInvolvedSection.tsx"
        use="The conversion section: the lg Discord button in a frost card, with the mailing list as a text link beside it."
      >
        <NoProps>
          Reads DISCORD_URL and MAILING_LIST_URL from src/lib/links.ts.
        </NoProps>
        <Block title="As rendered">
          <Stage
            label="GetInvolvedSection — cloud band, frost card"
            note="The only section with two grounds in it."
          >
            <GetInvolvedSection />
          </Stage>
        </Block>
        <Block title="Notes">
          <Rule>
            The card is frost, so the mailing-list link inside it uses{' '}
            <b>LINK_ON_FROST</b> and underlines on hover — brick on frost is
            4.03:1 and fails AA. The section band around the card is cloud,
            which is why the rule is “pick by the surface the link is painted
            on, not by the component it lives in”.
          </Rule>
          <Caption>
            The button here is the one call site that stretches the{' '}
            <b>lg</b> size further, with <b>sm:px-10 sm:py-5</b> through{' '}
            <b>className</b>.
          </Caption>
        </Block>
      </Entry>

      <Entry
        name="QuestionsSection"
        path="src/components/sections/QuestionsSection.tsx"
        use="Three questions newcomers actually ask, as a description list."
      >
        <NoProps>The three questions are a const array inside the file.</NoProps>
        <Block title="As rendered">
          <Stage
            label="QuestionsSection — on cloud"
            note="RevealGroup as='dl', with each RevealItem wrapping a <dt>/<dd> pair."
          >
            <QuestionsSection />
          </Stage>
        </Block>
        <Block title="Notes">
          <Caption>
            This is the section whose <b>SectionHeader</b> has no lede — the
            questions are the content, and a paragraph introducing them would
            only delay them.
          </Caption>
        </Block>
      </Entry>

      <Entry
        name="ContactSection"
        path="src/components/sections/ContactSection.tsx"
        use="The last content section: the organisers’ address and the workshop archive, both as display-sized links."
      >
        <NoProps>
          Reads CONTACT_EMAIL and RESOURCES_URL from src/lib/links.ts.
        </NoProps>
        <Block title="As rendered">
          <Stage
            label="ContactSection — on cloud"
            note="MailLink and ExternalLink at display-md with an 8px underline offset — the two links are the section."
          >
            <ContactSection />
          </Stage>
        </Block>
        <Block title="Notes">
          <Caption>
            On cloud, so both links take <b>LINK_ON_CLOUD</b> and hover to
            brick.
          </Caption>
        </Block>
      </Entry>

      <Entry
        name="SiteFooter"
        path="src/components/SiteFooter.tsx"
        use="Every hackbu.org page, the contact address and the club’s accounts. The page ends on frost."
      >
        <NoProps>
          Reads SITE_PAGES, SOCIAL_LINKS and CONTACT_EMAIL from
          src/lib/links.ts; the copyright year comes from the clock.
        </NoProps>
        <Block title="As rendered">
          <Stage
            label="SiteFooter — on frost"
            note="Four columns from 768px up: the lockup, then Club / More / Follow."
          >
            <SiteFooter />
          </Stage>
        </Block>
        <Block title="Notes">
          <Rule>
            Every link here is <b>LINK_ON_FROST</b>, and each column title is an{' '}
            <b>Eyebrow as="h2"</b> — in the footer an eyebrow really is the
            heading of the list beneath it, which is the whole reason the{' '}
            <b>as</b> prop exists. The bottom rule is <b>stone/60</b>, the only
            place besides the get-involved card that stone appears.
          </Rule>
        </Block>
      </Entry>
    </SheetSection>
  )
}
