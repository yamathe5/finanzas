document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const bondDataForm = document.getElementById('bond-data-form');
    const resultsSection = document.getElementById('results-section');
    const cashFlowTableBody = document.querySelector('#cash-flow-table tbody');
    const tceaSpan = document.getElementById('tcea');
    const treaSpan = document.getElementById('trea');
    const duracionSpan = document.getElementById('duracion');
    const duracionModificadaSpan = document.getElementById('duracion-modificada');
    const convexidadSpan = document.getElementById('convexidad');
    const precioMaximoSpan = document.getElementById('precio-maximo');
    const bondList = document.getElementById('bond-list');
    const saveBondButton = document.getElementById('save-bond-button');
     const clearDataButton = document.getElementById('clear-data-button');
    const configurationSection = document.getElementById('configuration-section');
    const tipoTasaSelect = document.getElementById('tipo-tasa');
    const capitalizacionLabel = document.getElementById('label-capitalizacion');
    const capitalizacionSelect = document.getElementById('capitalizacion');

    // Funciones para manejar el almacenamiento local
    function saveBondData(bondData) {
        let bonds = JSON.parse(localStorage.getItem('bonds')) || [];
        bonds.push(bondData);
        localStorage.setItem('bonds', JSON.stringify(bonds));
        displaySavedBonds();
    }

    function loadSavedBonds() {
        return JSON.parse(localStorage.getItem('bonds')) || [];
    }

    function displaySavedBonds() {
        bondList.innerHTML = '';
        const bonds = loadSavedBonds();
        bonds.forEach((bond, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `Bono ${index + 1} - Valor Nominal: ${bond.valorNominal}, Tasa Cupón: ${bond.tasaCupon}%`;
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.addEventListener('click', function() {
                deleteBond(index);
            });
            listItem.appendChild(deleteButton);
            bondList.appendChild(listItem);
        });
    }

    function deleteBond(index) {
        let bonds = JSON.parse(localStorage.getItem('bonds')) || [];
        bonds.splice(index, 1);
        localStorage.setItem('bonds', JSON.stringify(bonds));
        displaySavedBonds();
    }

     function clearData() {
        localStorage.removeItem('bonds');
        displaySavedBonds();
    }

    // Evento para borrar los datos
    clearDataButton.addEventListener('click', function() {
        clearData();
    });

    // Cargar bonos guardados al cargar la página
    displaySavedBonds();

    // Evento para guardar los datos del bono
    saveBondButton.addEventListener('click', function() {
        const valorNominal = parseFloat(document.getElementById('valor-nominal').value);
        const tasaCupon = parseFloat(document.getElementById('tasa-cupon').value);
        const plazo = parseFloat(document.getElementById('plazo').value);
        const frecuenciaPago = parseInt(document.getElementById('frecuencia-pago').value);
        const periodoGraciaTotal = parseInt(document.getElementById('periodo-gracia-total').value);
        const periodoGraciaParcial = parseInt(document.getElementById('periodo-gracia-parcial').value);
        const moneda = document.getElementById('moneda').value;
        const tipoTasa = document.getElementById('tipo-tasa').value;
        const capitalizacion = document.getElementById('capitalizacion').value;

        // Validar los datos (puedes agregar más validaciones)
        if (isNaN(valorNominal) || isNaN(tasaCupon) || isNaN(plazo)) {
            alert('Por favor, ingrese datos válidos.');
            return;
        }

        const bondData = {
            valorNominal: valorNominal,
            tasaCupon: tasaCupon,
            plazo: plazo,
            frecuenciaPago: frecuenciaPago,
            periodoGraciaTotal: periodoGraciaTotal,
            periodoGraciaParcial: periodoGraciaParcial,
            moneda: moneda,
            tipoTasa: tipoTasa,
            capitalizacion: capitalizacion
        };

        saveBondData(bondData);
    });

    // Evento para el formulario de datos del bono
    bondDataForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // Obtener los datos del formulario
        const valorNominal = parseFloat(document.getElementById('valor-nominal').value);
        const tasaCupon = parseFloat(document.getElementById('tasa-cupon').value);
        const plazo = parseFloat(document.getElementById('plazo').value);
        const frecuenciaPago = parseInt(document.getElementById('frecuencia-pago').value);
        const periodoGraciaTotal = parseInt(document.getElementById('periodo-gracia-total').value);
        const periodoGraciaParcial = parseInt(document.getElementById('periodo-gracia-parcial').value);

        const tipoTasa = document.getElementById('tipo-tasa').value;
        const capitalizacion = parseInt(document.getElementById('capitalizacion').value);

        // Validar los datos (puedes agregar más validaciones)
        if (isNaN(valorNominal) || isNaN(tasaCupon) || isNaN(plazo)) {
            alert('Por favor, ingrese datos válidos.');
            return;
        }

        // Calcular el flujo de caja
        const flujoCaja = calcularFlujoCajaAleman(valorNominal, tasaCupon, plazo, frecuenciaPago, periodoGraciaTotal, periodoGraciaParcial, tipoTasa, capitalizacion);

        //Calcular los indicadores financieros
        const tcea = calcularTCEA(flujoCaja, valorNominal);
        const trea = calcularTREA(flujoCaja, valorNominal);
        const duracion = calcularDuracion(flujoCaja, tasaCupon);
        const duracionModificada = calcularDuracionModificada(duracion, tasaCupon);
        const convexidad = calcularConvexidad(flujoCaja, tasaCupon);
        const precioMaximo = calcularPrecioMaximo(flujoCaja);

        // Mostrar los resultados
        mostrarResultados(flujoCaja, tcea, trea, duracion, duracionModificada, convexidad, precioMaximo);
        resultsSection.style.display = 'block';
    });

    // Evento para mostrar u ocultar la capitalización
    tipoTasaSelect.addEventListener('change', function() {
        if (tipoTasaSelect.value === 'nominal') {
            capitalizacionLabel.style.display = 'block';
            capitalizacionSelect.style.display = 'block';
        } else {
            capitalizacionLabel.style.display = 'none';
            capitalizacionSelect.style.display = 'none';
        }
    });

    //Declarando la variable cuotaAmortizacionGlobal
    let cuotaAmortizacionGlobal = 0;

     // Función para calcular el flujo de caja con el método alemán
    function calcularFlujoCajaAleman(valorNominal, tasaCupon, plazo, frecuenciaPago, periodoGraciaTotal, periodoGraciaParcial, tipoTasa, capitalizacion) {
    const flujoCaja = [];
    let saldoPendiente = valorNominal;
    let cuotaAmortizacion = valorNominal / (plazo * frecuenciaPago);
    let periodoGraciaTotalPeriodos = periodoGraciaTotal * frecuenciaPago;
    let periodoGraciaParcialPeriodos = periodoGraciaParcial * frecuenciaPago;

    //Si la tasa es nominal, se divide entre la capitalización
    if (tipoTasa === 'nominal') {
        tasaCupon = tasaCupon / capitalizacion;
    } else {
        tasaCupon = tasaCupon / 100;
    }

    cuotaAmortizacionGlobal = valorNominal / (plazo * frecuenciaPago);

    for (let periodo = 1; periodo <= plazo * frecuenciaPago; periodo++) {
        let interes = 0;
        let amortizacion = 0;
        let cuotaTotal = 0;

        if (periodo <= periodoGraciaTotalPeriodos) {
            // Periodo de gracia total: solo se pagan intereses
            interes = saldoPendiente * tasaCupon / frecuenciaPago;
            cuotaTotal = interes;
        } else if (periodo <= periodoGraciaTotalPeriodos + periodoGraciaParcialPeriodos) {
            // Periodo de gracia parcial: se pagan intereses y una parte de la amortización
            interes = saldoPendiente * tasaCupon / frecuenciaPago;
            cuotaTotal = interes; // No hay amortización en el periodo de gracia parcial
        } else {
            // Periodo normal: se pagan intereses y amortización
            interes = saldoPendiente * tasaCupon / frecuenciaPago;
            amortizacion = cuotaAmortizacion;
            cuotaTotal = interes + amortizacion;
        }

        //Asegurar que el saldo pendiente no sea negativo
         if (saldoPendiente - amortizacion < 0) {
            amortizacion = saldoPendiente;
            cuotaTotal = interes + amortizacion;
            saldoPendiente = 0;
        } else {
            saldoPendiente -= amortizacion;
        }

        flujoCaja.push({
            periodo: periodo,
            cuota: cuotaTotal,
            interes: interes,
            amortizacion: amortizacion,
            saldo: saldoPendiente > 0 ? saldoPendiente : 0
        });
    }

    return flujoCaja;
}

    // Función para calcular la TCEA (aproximada)
    function calcularTCEA(flujoCaja, valorNominal) {
        // Implementa la fórmula para calcular la TCEA
        // ...
        return 0.00; // Reemplaza con el valor calculado
    }

    // Función para calcular la TREA (aproximada)
    function calcularTREA(flujoCaja, valorNominal) {
        // Implementa la fórmula para calcular la TREA
        // ...
        return 0.00; // Reemplaza con el valor calculado
    }

     // Función para calcular la Duración
    function calcularDuracion(flujoCaja, tasaCupon) {
        // Implementa la fórmula para calcular la Duración
        // ...
        return 0.00; // Reemplaza con el valor calculado
    }

    // Función para calcular la Duración Modificada
    function calcularDuracionModificada(duracion, tasaCupon) {
        // Implementa la fórmula para calcular la Duración Modificada
        // ...
        return 0.00; // Reemplaza con el valor calculado
    }

    // Función para calcular la Convexidad
     function calcularConvexidad(flujoCaja, tasaCupon) {
        // Implementa la fórmula para calcular la Convexidad
        // ...
        return 0.00; // Reemplaza con el valor calculado
    }

     // Función para calcular el Precio Máximo
     function calcularPrecioMaximo(flujoCaja) {
        // Implementa la fórmula para calcular el Precio Máximo
        // ...
        return 0.00; // Reemplaza con el valor calculado
    }


    // Función para mostrar los resultados en la tabla
    function mostrarResultados(flujoCaja, tcea, trea, duracion, duracionModificada, convexidad, precioMaximo) {
        cashFlowTableBody.innerHTML = ''; // Limpiar la tabla

        flujoCaja.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.periodo}</td>
                <td>${item.cuota.toFixed(2)}</td>
                <td>${item.interes.toFixed(2)}</td>
                <td>${item.amortizacion.toFixed(2)}</td>
                <td>${item.saldo.toFixed(2)}</td>
            `;
            cashFlowTableBody.appendChild(row);
        });

        tceaSpan.textContent = tcea.toFixed(2) + '%';
        treaSpan.textContent = trea.toFixed(2) + '%';
        duracionSpan.textContent = duracion.toFixed(2);
        duracionModificadaSpan.textContent = duracionModificada.toFixed(2);
        convexidadSpan.textContent = convexidad.toFixed(2);
        precioMaximoSpan.textContent = precioMaximo.toFixed(2);
    }
});