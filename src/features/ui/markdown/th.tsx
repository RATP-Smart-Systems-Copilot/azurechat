export const th = {
    render: "Th",
};

export const Th = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {

    return <th  scope="col" className="px-6 py-3">
        {children}
    </th>;
};

