import type {Route} from './router';
import {navItems} from './Sidebar';
export function MobileTabBar({route}: {route: Route}) {
  return <nav className="mobile-tab-bar" aria-label="Mobile navigation">{navItems.map(({path, short, icon: Icon}) => <a key={path} href={`#${path}`} aria-current={route.path.startsWith(path) ? 'page' : undefined}><Icon size={20}/><span>{short}</span></a>)}</nav>;
}
