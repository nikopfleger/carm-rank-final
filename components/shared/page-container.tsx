import { ReactNode } from 'react';
import styles from './page-container.module.css';

interface PageContainerProps {
    children: ReactNode;
    className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
    return (
        <div className={`${styles.pageContainer} ${className}`}>
            {children}
        </div>
    );
}
