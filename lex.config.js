import { defineLexiconConfig } from '@atcute/lex-cli';

export default defineLexiconConfig({
	files: ['src/lexicons/**/*.json'],
	outdir: 'src/generated/lexicons/',
});
