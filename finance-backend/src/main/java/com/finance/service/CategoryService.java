package com.finance.service;

import com.finance.model.Category;
import com.finance.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository repository;

    public List<Category> findAll() {
        return repository.findAll();
    }

    public Category save(Category category) {
        return repository.save(category);
    }

    public Category update(Long id, Category categoryDetails) {
        Category category = repository.findById(id).orElseThrow();
        category.setName(categoryDetails.getName());
        category.setType(categoryDetails.getType());
        category.setColor(categoryDetails.getColor());
        category.setMonthlyLimit(categoryDetails.getMonthlyLimit());
        return repository.save(category);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
