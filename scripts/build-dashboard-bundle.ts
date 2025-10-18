#!/usr/bin/env tsx

import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';

async function buildDashboardBundle() {
  console.log('🔨 Building dashboard bundle...');

  const entryPath = path.join(process.cwd(), 'scripts/dashboard-entry.tsx');
  const outfile = path.join(process.cwd(), 'hugo-export/static/trading-dashboard/dashboard-bundle.js');

  try {
    // Create a plugin to replace React imports with globals (but bundle Recharts!)
    const globalExternalPlugin = {
      name: 'global-external',
      setup(build: any) {
        // Only externalize React and ReactDOM - bundle everything else
        build.onResolve({ filter: /^react$/ }, () => ({ path: 'react', namespace: 'external-global' }));
        build.onResolve({ filter: /^react-dom\/client$/ }, () => ({ path: 'react-dom/client', namespace: 'external-global' }));
        build.onResolve({ filter: /^react-dom$/ }, () => ({ path: 'react-dom', namespace: 'external-global' }));
        build.onResolve({ filter: /^lucide-react$/ }, () => ({ path: 'lucide-react', namespace: 'external-global' }));

        build.onLoad({ filter: /.*/, namespace: 'external-global' }, (args: any) => {
          const globalMap: Record<string, string> = {
            'react': `
              const React = window.React;
              export const useState = React.useState;
              export const useEffect = React.useEffect;
              export const useRef = React.useRef;
              export const useMemo = React.useMemo;
              export const useCallback = React.useCallback;
              export const useImperativeHandle = React.useImperativeHandle;
              export const useContext = React.useContext;
              export const createContext = React.createContext;
              export const Component = React.Component;
              export const PureComponent = React.PureComponent;
              export const createElement = React.createElement;
              export const cloneElement = React.cloneElement;
              export const isValidElement = React.isValidElement;
              export const Children = React.Children;
              export const forwardRef = React.forwardRef;
              export default React;
            `,
            'react-dom/client': 'export const createRoot = window.ReactDOM.createRoot;',
            'react-dom': 'export default window.ReactDOM;',
            'lucide-react': 'export const TrendingUp = () => null; export const TrendingDown = () => null; export const DollarSign = () => null; export const BarChart3 = () => null; export const Activity = () => null; export const AlertCircle = () => null;'
          };
          return { contents: globalMap[args.path] || '', loader: 'js' };
        });
      },
    };

    await esbuild.build({
      entryPoints: [entryPath],
      bundle: true,
      minify: false,
      format: 'iife',
      globalName: 'Dashboard',
      outfile,
      plugins: [globalExternalPlugin],
      jsx: 'transform',
      target: 'es2015',
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts'
      }
    });

    console.log(`✅ Bundle created: ${outfile}`);
    console.log(`   Size: ${(fs.statSync(outfile).size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildDashboardBundle();
