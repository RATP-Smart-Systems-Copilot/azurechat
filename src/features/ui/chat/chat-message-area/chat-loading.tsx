import React, { useEffect, useState } from "react";
import { LoadingIndicator } from "../../loading";

export const ChatLoading = () => {
  const [isLongLoading, setIsLongLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLongLoading(true);
    }, 10000); // 10 secondes

    return () => clearTimeout(timer); // Nettoyage du timer
  }, []);

  return (
    <div className="flex justify-center p-8">
      <LoadingIndicator isLoading={true} />
      {isLongLoading ? (
        <span>Veuillez patienter encore un peu...</span>
      ) : (
        <span>Laissez moi réfléchir...</span>
      )}
    </div>
  );
};
