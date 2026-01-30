// @ts-check
const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "LEO's Code Archive",
  tagline: 'Backend Architecture & Infrastructure, WebRTC Real-time 3D Streaming',
  favicon: 'img/favicon.ico',

  url: 'https://robanian.github.io',
  baseUrl: '/',
  organizationName: 'robanian',
  projectName: 'robanian.github.io',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/robanian/robanian.github.io/tree/main/',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/robanian/robanian.github.io/tree/main/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.png',
      navbar: {
        title: "LEO's Code",
        logo: {
          alt: 'LEO Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: '📚 Tech Docs',
          },
          { to: '/blog', label: '📝 Blog', position: 'left' },
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/robanian',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Tech Stack',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'Projects',
            items: [
              {
                label: 'DDukDDak Platform',
                to: '/docs/projects/ddukddak',
              },
            ],
          },
          {
            title: 'Connect',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/robanian',
              },
              {
                label: 'Email',
                href: 'mailto:colorfuleffect@gmail.com',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} LEO (Nam Taewoo). Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['bash', 'javascript', 'typescript', 'json', 'yaml'],
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
    }),
};

module.exports = config;
