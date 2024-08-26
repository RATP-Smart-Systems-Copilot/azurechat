export const table = {
    render: "Table",
};

export const Table = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {

    return <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full bg-background text-sm text-left rtl:text-right text-black-500 dark:text-black-400">
                {children}
            </table>
        </div>;
};

