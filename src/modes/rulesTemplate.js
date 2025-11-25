const BASE_CARD = 'rounded-lg border border-slate-700/70 p-4 shadow-inner';
const CARD_STYLES = {
    primary: `${BASE_CARD} bg-slate-800/60`,
    secondary: `${BASE_CARD} bg-slate-800/50`,
    dark: `${BASE_CARD} bg-slate-900/60`,
};

const SUBTITLE = 'text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-2';

const renderCard = ({
    title,
    body,
    variant = 'primary',
    titleTag = 'h5',
    bodyClass = 'text-slate-300',
    titleClass,
}) => `
  <section class="${CARD_STYLES[variant] || CARD_STYLES.primary}">
    ${
        title
            ? `<${titleTag} class="${
                  titleClass
                      ? titleClass
                      : variant === 'primary' && titleTag === 'h4'
                        ? 'text-lg font-semibold text-slate-100 mb-2'
                        : SUBTITLE
              }">${title}</${titleTag}>`
            : ''
    }
    <p class="${bodyClass}">${body}</p>
  </section>
`;

const renderColumns = (columns = []) => `
  <div class="grid gap-4 md:grid-cols-2">
    ${columns.map((column) => renderCard({ ...column, variant: 'secondary' })).join('')}
  </div>
`;

const renderBreakdown = ({ title, items = [] }) => `
  <section class="${CARD_STYLES.primary}">
    ${title ? `<h5 class="${SUBTITLE} mb-3">${title}</h5>` : ''}
    <dl class="space-y-3">
      ${items
        .map(
            (item) => `
      <div class="rounded-md bg-slate-900/60 p-3 border border-slate-700/60">
        <dt class="font-semibold text-slate-100">${item.title}</dt>
        <dd class="text-slate-300 mt-1 text-sm">${item.body}</dd>
      </div>
    `
        )
        .join('')}
    </dl>
  </section>
`;

const renderListSection = ({ title, items = [], variant = 'primary' }) => `
  <section class="${CARD_STYLES[variant] || CARD_STYLES.primary}">
    ${title ? `<h5 class="${SUBTITLE} mb-2">${title}</h5>` : ''}
    <ul class="text-slate-300 text-sm list-disc space-y-1 pl-5">
      ${items.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  </section>
`;

export const buildRulesHtml = (content = {}) => {
    const parts = [];

    if (content.overview) {
        parts.push(
            renderCard({
                ...content.overview,
                variant: 'primary',
                titleTag: 'h4',
                bodyClass: content.overview.bodyClass || 'text-slate-300',
            })
        );
    }

    if (content.columns && content.columns.length) {
        parts.push(renderColumns(content.columns));
    }

    if (content.sections && content.sections.length) {
        parts.push(
            content.sections
                .map((section) =>
                    renderCard({
                        ...section,
                        bodyClass: section.bodyClass || 'text-slate-300 text-sm',
                    })
                )
                .join('')
        );
    }

    if (content.breakdown && content.breakdown.items && content.breakdown.items.length) {
        parts.push(renderBreakdown(content.breakdown));
    }

    if (content.listSections && content.listSections.length) {
        parts.push(content.listSections.map((section) => renderListSection(section)).join(''));
    }

    if (content.notes) {
        parts.push(
            renderCard({
                ...content.notes,
                variant: 'primary',
                bodyClass: content.notes.bodyClass || 'text-slate-300',
            })
        );
    }

    return `<div class="space-y-5">
${parts.join('\n')}
</div>`;
};

export const buildRulesByLocale = (contentByLocale = {}) =>
    Object.fromEntries(
        Object.entries(contentByLocale).map(([lang, content]) => [lang, buildRulesHtml(content)])
    );

export default buildRulesByLocale;
