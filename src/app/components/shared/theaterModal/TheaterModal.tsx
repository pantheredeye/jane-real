"use client";

import { Dialog } from "@/app/components/ui/Dialog";
import TheaterCloseButton from "./TheaterCloseButton";
import "./theater-modal.css";

interface TheaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function TheaterModal({ isOpen, onClose, children }: TheaterModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="theater-modal-backdrop" />
        <Dialog.Popup className="theater-modal-container">
          <TheaterCloseButton onClick={onClose} />

          <div className="theater-modal-border theater-modal-border-top"></div>
          <div className="theater-modal-border theater-modal-border-right"></div>
          <div className="theater-modal-border theater-modal-border-bottom"></div>
          <div className="theater-modal-border theater-modal-border-left"></div>

          <div className="theater-modal-content">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
