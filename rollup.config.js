import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import license from 'rollup-plugin-license';
import replace from '@rollup/plugin-replace';

const licenseLine = {
    banner: `/*! VDM Uikit v${require('./package.json').version} | https://git.vdm.dev/joomla/uikit | (c) 2020 - ${new Date().getFullYear()} Llewellyn van der Merwe | MIT License */`
};

const licenseHeader = {
    banner: `/**
 * VDM Uikit v${require('./package.json').version}
 * https://git.vdm.dev/joomla/uikit
 * (c) 2020 - ${new Date().getFullYear()} Llewellyn van der Merwe
 * MIT License
 **/
`};

export default [
    {
        input: 'src/js/vdm.js',
        plugins: [
            license(licenseHeader),
            replace({
                'process.env.DEBUG': true,
                preventAssignment: true,
            }),
            resolve(),  // Resolves local and node modules
            commonjs()
        ],
        output: {
            file: 'dist/js/vdm.js',
            format: 'iife',
            name: 'VDMUikit',
            globals: {
                uikit: 'UIkit'
            }
        },
        external: ['uikit'],  // UIkit is treated as external
    },
    {
        input: 'src/js/vdm.js',
        plugins: [
            resolve(),  // Resolves local and node modules
            commonjs(),
            babel({
                babelHelpers: 'bundled',
                presets: ['@babel/preset-env'],
            }),
            terser(),  // Minify the output
            license(licenseLine),
            replace({
                'process.env.DEBUG': false,
                preventAssignment: true,
            })
        ],
        external: ['uikit'],  // UIkit is treated as external
        output: {
            file: 'dist/js/vdm.min.js',
            format: 'iife',
            name: 'VDMUikit',
            globals: {
                uikit: 'UIkit'
            },
        },
    },
];
