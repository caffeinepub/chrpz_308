// Legacy EditPostModal — replaced by inline compose in HomePage
// Kept as stub to avoid breaking imports elsewhere
import type { Post } from "../types";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onPostUpdated: () => void;
}

export default function EditPostModal(_props: EditPostModalProps) {
  return null;
}
