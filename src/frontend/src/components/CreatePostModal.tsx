// Legacy CreatePostModal — replaced by inline compose in HomePage
// Kept as stub to avoid breaking imports elsewhere

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostModal(_props: CreatePostModalProps) {
  return null;
}
