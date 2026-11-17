import {useEffect} from 'react';
import {useSimulation} from '../../state/SimulationContext';
import {simulationActions} from '../../state/simulationStore';
import {uiStore} from '../../state/uiStore';
import {isEditable, shortcutAction} from './commands';
import {useSettings} from '../../state/settingsStore';
import {availableTabs} from '../explorer/visualizationTabs';
import type {Route} from '../../app/router';

export function useShortcuts(route: Route) {
  const model = useSimulation(); const {experience} = useSettings();
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {event.preventDefault(); if (!document.querySelector('dialog[open]') || uiStore.get().dialog === 'commands') uiStore.set({dialog: uiStore.get().dialog === 'commands' ? null : 'commands'}); return;}
      if (event.key === 'Escape' && uiStore.get().tourStep >= 0) {uiStore.set({tourStep: -1}); return;}
      if (event.ctrlKey || event.metaKey || event.altKey || isEditable(event.target) || document.querySelector('dialog[open]')) return;
      const action = shortcutAction(event.key); if (!action) return;
      if (action === 'help') {event.preventDefault(); uiStore.set({dialog: 'help'}); return;}
      if (!['explorer', 'performance'].includes(route.view)) return;
      event.preventDefault();
      if (event.repeat && action !== 'next' && action !== 'previous') return;
      if (action === 'play') model.togglePlay();
      if (action === 'next') model.step(1);
      if (action === 'previous') model.step(-1);
      if (action === 'reset') simulationActions.reset();
      if (action === 'finish') model.finish();
      if (action === 'nextTab' || action === 'previousTab') {
        const tabs = availableTabs(model.mode, experience); const index = Math.max(0, tabs.indexOf(uiStore.get().tab));
        uiStore.set({tab: tabs[(index + (action === 'nextTab' ? 1 : -1) + tabs.length) % tabs.length]});
      }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [model, route.view, experience]);
}
