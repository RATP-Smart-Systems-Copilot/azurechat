export const link = {
  render: "Link",
  attributes: {
    href: { type: String, required: true },
  },
};

function generateUniqId() {
  // Exemple simple : timestamp + nombre aléatoire
  return `presentation_${Date.now()}_${Math.floor(Math.random() * 10000)}.pptx`;
}

export const Link = ({ href, children }: { href: string; children: string }) => {
  const isPptx = href.toLowerCase().endsWith(".pptx");

  // Générer un nom de fichier unique si pptx
  const fileName = isPptx ? generateUniqId() : undefined;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-muted-foreground hover:underline"
      {...(isPptx && fileName ? { download: fileName } : {})}
    >
      {children}
    </a>
  );
};
