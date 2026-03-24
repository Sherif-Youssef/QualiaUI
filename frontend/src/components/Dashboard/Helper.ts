const formatProjectName = (name: any) => {
    if (!name || typeof name !== 'string') {
        return "";
    }
    if (name.length <= 20) return name;
    try {
        return name
            .split(/[\s-_]+/)
            .filter(Boolean)
            .map(word => word[0].toUpperCase())
            .join('');
    } catch (err) {
        return name;
    }
};

export {
    formatProjectName
}