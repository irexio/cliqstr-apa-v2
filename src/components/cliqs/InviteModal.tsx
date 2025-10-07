"use client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import InviteClient from "@/components/InviteClient";

interface InviteModalProps {
  cliqId: string;
  open: boolean;
  onClose: () => void;
  canInvite?: boolean;
}

export default function InviteModal({ cliqId, open, onClose, canInvite = false }: InviteModalProps) {
  if (!canInvite) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-6 rounded-lg">
        <DialogTitle className="text-xl font-bold mb-2">Invite to Cliq</DialogTitle>
        <InviteClient cliqId={cliqId} />
        <button
          className="mt-4 w-full bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200"
          onClick={onClose}
        >
          Close
        </button>
      </DialogContent>
    </Dialog>
  );
}
