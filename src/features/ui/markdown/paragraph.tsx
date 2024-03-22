import React from "react";
import { cn } from "@/ui/lib";

export const Paragraph = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  // Fonction pour remplacer les liens par un rendu personnalisé
  const renderLinks = (node: React.ReactNode) => {
    // Vérifie si le nœud est un lien
    if (React.isValidElement(node) && node.type === 'a') {
      // Remplace le rendu du lien par votre propre logique
      return (
        <a href={node.props.href} target="_blank" rel="noopener noreferrer" className="font-medium text-secondary hover:underline">
          {node.props.children}
        </a>
      );
    }
    return node;
  };

  // Applique la fonction de rendu personnalisé à tous les enfants
  const renderedChildren = React.Children.map(children, renderLinks);

  return <div className={cn(className, "py-3")}>{renderedChildren}</div>;
};

export const paragraph = {
  render: "Paragraph",
};
