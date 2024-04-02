export const list = {
    render: "List",
    attributes: {
        ordered: { type: Boolean, render: false, required: true },
    },
};

export const List = ({
    children,
    ordered,
  }: {
    children: React.ReactNode;
    ordered: string
  }) => {

    return ordered ? <ol className="list-decimal p-4 m-1">
        {children}
    </ol>: <ul className="list-disc p-4 m-1">
        {children}
    </ul>;
};

