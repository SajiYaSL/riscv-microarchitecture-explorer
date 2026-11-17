import {Copy} from 'lucide-react';
import {Dialog} from '../../components/ui/Dialog';
import {Button} from '../../components/ui/Button';
import {uiStore, useUI, notify} from '../../state/uiStore';
import {copyText} from './export';
export function ShareDialog() {
  const {dialog, shareLink} = useUI();
  return <Dialog open={dialog === 'share'} onClose={() => uiStore.set({dialog: null})} title="Share your experiment" description="This link includes the program and configuration. It opens paused."><label className="share-link-field">Workspace link<input type="text" readOnly value={shareLink} onFocus={event => event.target.select()}/></label><Button variant="primary" onClick={() => {void copyText(shareLink).then(() => notify('Workspace link copied.')).catch(() => notify('Select the link and copy it with your keyboard.'));}}><Copy/>Copy link</Button></Dialog>;
}
