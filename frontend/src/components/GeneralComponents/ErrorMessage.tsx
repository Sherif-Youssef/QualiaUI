export const ErrorMessage = ({ message }: { message: string }) => {
    return (
        <div className="mb-6 p-3 rounded-xl bg-failure/10 border border-failure/20 text-failure text-xs font-bold animate-in shake-in">
            {message}
        </div>
    );
}