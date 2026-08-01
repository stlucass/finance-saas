package com.finance.service;

import com.finance.model.Transaction;
import com.finance.repository.TransactionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecurrenceService {

    private final TransactionRepository transactionRepository;

    // Roda todo dia as 02:00 da manha
    @Scheduled(cron = "0 0 2 * * *")
    public void processRecurringTransactions() {
        log.info("Iniciando rotina de processamento de transações recorrentes...");
        LocalDate today = LocalDate.now();

        List<Transaction> pendingTransactions = transactionRepository
                .findByRecurringTrueAndNextRecurrenceDateLessThanEqual(today);

        for (Transaction template : pendingTransactions) {
            try {
                // Clona a transacao original (sem a flag de recorrencia)
                Transaction newTransaction = Transaction.builder()
                        .description(template.getDescription())
                        .amount(template.getAmount())
                        .date(template.getNextRecurrenceDate())
                        .type(template.getType())
                        .recurring(false)
                        .account(template.getAccount())
                        .category(template.getCategory())
                        .build();

                transactionRepository.save(newTransaction);

                // Atualiza a proxima data de cobranca no template (assumindo Mensal)
                template.setNextRecurrenceDate(template.getNextRecurrenceDate().plusMonths(1));
                transactionRepository.save(template);

                log.info("Transação recorrente gerada com sucesso: {} (Data: {})", 
                         newTransaction.getDescription(), newTransaction.getDate());

            } catch (Exception e) {
                log.error("Erro ao processar transação recorrente ID: {}", template.getId(), e);
            }
        }
        
        log.info("Rotina de recorrência finalizada. Total processado: {}", pendingTransactions.size());
    }

    // Para fins de teste (rodar assim que a aplicacao iniciar)
    @PostConstruct
    public void runOnStartupForTesting() {
        log.info("[TESTE] Forçando a rotina de recorrência na inicialização para testes...");
        processRecurringTransactions();
    }
}
