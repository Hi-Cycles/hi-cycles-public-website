import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Hi-Cycles',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Hi-Cycles' },
      ],
      sidebar: [],
    }),
  ],
});
