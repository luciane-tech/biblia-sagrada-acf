import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** true quando TalkBack/VoiceOver está ativo. */
export function useLeitorDeTela(): boolean {
  const [ativo, setAtivo] = useState(false);
  useEffect(() => {
    let montado = true;
    AccessibilityInfo.isScreenReaderEnabled().then((v) => montado && setAtivo(v));
    const inscricao = AccessibilityInfo.addEventListener('screenReaderChanged', setAtivo);
    return () => {
      montado = false;
      inscricao.remove();
    };
  }, []);
  return ativo;
}
