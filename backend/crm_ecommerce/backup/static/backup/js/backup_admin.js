// Funcionalidad para el panel de administración de backups
(function($) {
    'use strict';
    
    // Mostrar/ocultar campos según el tipo de backup
    $(document).ready(function() {
        // Mejorar la interfaz de los botones de acción
        $('.field-actions_column a.button').addClass('button');
        
        // Confirmación antes de restaurar
        $('a[href*="restore"]').on('click', function(e) {
            if (!confirm('¿Está seguro de que desea restaurar este respaldo? Esta acción sobrescribirá los datos existentes.')) {
                e.preventDefault();
                return false;
            }
        });
        
        // Mejorar la visualización del formulario de creación
        $('#backup_form input[type="text"], #backup_form textarea, #backup_form select').addClass('form-control');
        
        // Select2 para los campos de selección
        if (typeof django !== 'undefined' && django.jQuery && django.jQuery.fn.select2) {
            $('select').select2({
                width: '100%',
                theme: 'classic'
            });
        }
    });
    
    // Acción personalizada para descargar múltiples backups
    function downloadSelectedBackups(selectedItems) {
        if (selectedItems.length === 0) {
            alert('Por favor seleccione al menos un respaldo para descargar.');
            return;
        }
        
        if (selectedItems.length > 1) {
            alert('Solo puede descargar un respaldo a la vez.');
            return;
        }
        
        window.location.href = '/admin/backup/backup/' + selectedItems[0] + '/download/';
    }
    
    // Exponer la función al ámbito global para que Django pueda llamarla
    window.downloadSelectedBackups = downloadSelectedBackups;
    
})(django.jQuery);
