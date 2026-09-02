// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	vite: {
		server: {
			watch: {
				usePolling: true,
				interval: 100,
				binaryInterval: 300,
				ignored: ['**/.git/**', '**/.dropbox**', '**/.DS_Store', '**/node_modules/**'],
				awaitWriteFinish: {
					stabilityThreshold: 100,
					pollInterval: 100,
				},
			},
		},
	},
	integrations: [
		starlight({
			title: 'HI-Cycles',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Hi-Cycles/' }],
			sidebar: [
				{
					label: 'Research',
					items: [{ label: 'Projects', slug: 'research' },
						 { label: 'Publications', slug: 'publications' }],
				},
				// {
				// 	label: 'Publications',
				// 	items: [{ label: 'Publications', slug: 'publications' }],
				// },
				// {
				// 	label: 'Guides',
				// 	items: [
				// 		// Each item here is one entry in the navigation menu.
				// 		{ label: 'Example Guide', slug: 'guides/example' },
				// 	],
				// },
				// {
				// 	label: 'Reference',
				// 	items: [{ autogenerate: { directory: 'reference' } }],
				// },
			],
		}),
	],
});
