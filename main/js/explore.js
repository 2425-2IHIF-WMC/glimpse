let currentFilter = '';

document.addEventListener('DOMContentLoaded', () => {
    currentFilter = 'none';
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-type');
        });
    });
});

function loadAllFilter(){
    
}