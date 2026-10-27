import Modal from "./Modal";

// youtube trailer in a popup, used on details and explore
export default function TrailerModal({ title, videoKey, onClose }) {
  return (
    <Modal title={`${title} trailer`} wide onClose={onClose}>
      <iframe
        src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
        title="Trailer"
        allow="autoplay; fullscreen"
        allowFullScreen
        className="aspect-video w-full rounded-lg"
      />
    </Modal>
  );
}
