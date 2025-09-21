interface SectionTitleProps {
    title: string;
    variant?: 'tournaments' | 'seasons' | 'history' | 'default';
    className?: string;
}

export function SectionTitle({ title, variant = 'default', className = '' }: SectionTitleProps) {
    const getVariantStyles = () => {
        switch (variant) {
            case 'tournaments':
                return {
                    gradient: 'from-yellow-500 via-orange-600 to-red-600',
                    line: 'from-yellow-500 via-orange-600 to-red-600'
                };
            case 'seasons':
                return {
                    gradient: 'from-green-500 via-emerald-600 to-teal-600',
                    line: 'from-green-500 via-emerald-600 to-teal-600'
                };
            case 'history':
                return {
                    gradient: 'from-purple-500 via-blue-600 to-indigo-600',
                    line: 'from-purple-500 via-blue-600 to-indigo-600'
                };
            default:
                return {
                    gradient: 'from-gray-500 via-gray-600 to-gray-700',
                    line: 'from-gray-500 via-gray-600 to-gray-700'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className={`relative mb-8 ${className}`}>
            <h2 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${styles.gradient} bg-clip-text text-transparent text-center mb-2`}>
                {title}
            </h2>
            <div className={`w-20 h-1 mx-auto rounded-full bg-gradient-to-r ${styles.line}`}></div>
        </div>
    );
}
