export default function NewsPage() {
    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">뉴스 목록</h2>
                    <button className="btn btn-primary">
                        + 새 뉴스 추가
                    </button>
                </div>
                <div className="card-body">
                    <div className="empty-state">
                        <div className="empty-state-icon">📰</div>
                        <h3>등록된 뉴스가 없습니다</h3>
                        <p>새 뉴스를 추가하여 시작하세요.</p>
                        <button className="btn btn-primary">+ 새 뉴스 추가</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
