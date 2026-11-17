import {AppShell} from './app/AppShell';
import {ViewErrorBoundary} from './app/ViewErrorBoundary';

export default function App() {
  return <ViewErrorBoundary><AppShell/></ViewErrorBoundary>;
}
