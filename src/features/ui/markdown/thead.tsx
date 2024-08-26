export const thead = {
    render: "Thead",
};

export const Thead = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {

    return <thead  className="text-xs text-muted-foreground uppercase border-b border-primary">
        {children}
    </thead>;
};

