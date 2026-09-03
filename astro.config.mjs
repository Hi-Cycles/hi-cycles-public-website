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
			favicon: '/favicon.png',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Hi-Cycles/' }],
			sidebar: [
				{
					label: 'Research',
					items: [{ label: 'Projects', slug: 'research' },
						 { label: 'Publications', slug: 'publications' }],
				},
				{
					label: 'People',
					items: [{ label: 'Group Members', slug: 'people' }],
				},
				{
					label: 'Teaching',
					items: [{ label: 'OCN 623: Chemical Oceanography', slug: 'ocn623' },
					{ label: 'OCN 201: Science of the Sea', slug: 'ocn201' },
					],
				},
				{
					label: 'Service',
					items: [{ label: 'Kahuliau', slug: 'kahuliau' },
					],
				},
				{
					label: 'Outreach',
					items: [{ label: 'Lego float building', slug: 'legos' },
					{ label: '3D Printed Floats', slug: '3d-printed-floats' },
					],
				},
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
