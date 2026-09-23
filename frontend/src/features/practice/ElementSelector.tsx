import { useEffect, useState } from "react";
import { getMeditationElements } from "../../lib/api";

type MeditationElement = {
  id: number;
  name: string;
  slug: string;
  domain: string | null;
  description: string | null;
  image_url: string | null;
};

function ElementSelector() {
  const [elements, setElements] = useState<MeditationElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMeditationElements()
      .then(setElements)
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p>Loading meditation elements...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h2>Choose your meditation object</h2>

      {elements.map((element) => (
        <div key={element.id}>
          <h3>{element.name}</h3>
          <p>{element.description}</p>
        </div>
      ))}
    </div>
  );
}

export default ElementSelector;