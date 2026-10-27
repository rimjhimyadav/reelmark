import { useState } from "react";
import { Star } from "lucide-react";

// 5 stars you can click. click the same star again to clear the rating
export default function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value; // while hovering, show what you would pick

  return (
    <div className="flex" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onChange(star === value ? 0 : star)}
          onMouseEnter={() => setHover(star)}
          title={`${star} out of 5`}
          className="p-0.5"
        >
          <Star size={22} className={star <= shown ? "fill-yellow-400 text-yellow-400" : "text-muted"} />
        </button>
      ))}
    </div>
  );
}
