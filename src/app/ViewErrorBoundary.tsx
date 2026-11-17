import {Component, type ReactNode} from 'react';
import {AlertTriangle, RotateCcw} from 'lucide-react';
import {DEFAULT_WORKSPACE, simulationActions} from '../state/simulationStore';

export class ViewErrorBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() {
    if (this.state.failed) return <section className="panel error-state" role="alert" style={{padding: 'var(--sp-6)'}}>
      <AlertTriangle size={32}/><h1>Let’s get your workspace back.</h1><p>This view could not load. Reset to the starter program and try again.</p>
      <button className="run-btn" onClick={() => {simulationActions.restore(DEFAULT_WORKSPACE); this.setState({failed: false});}}><RotateCcw/>Reset workspace</button>
    </section>;
    return this.props.children;
  }
}
