
export const link = {
    render: "Link",
    attributes: {
        href: { type: String, required: true },
    },
};

export const Link = ({ href, children }: {
    href: string;
    children: string;
  }) => {

    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-muted-foreground hover:underline">
            {children}
        </a>);
};

